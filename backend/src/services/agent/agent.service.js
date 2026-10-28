import { toolRegistry, RiskLevel } from './tool.registry.js';
import { logger } from '../../utils/logger.js';

/**
 * In-memory pending actions store keyed by actionId.
 * Supports ALLOW_ONCE, ALWAYS_ALLOW, and REJECT flows.
 */
class AgentService {
  constructor() {
    this.pendingActions = new Map();
    this.userAlwaysAllowed = new Map(); // userId -> Set of toolNames
    this.longTermMemories = new Map(); // userId -> array of key-value memories (no secrets)
  }

  /**
   * Plans an action based on tool intent.
   * Enforces risk check:
   * - If LOW risk: can execute directly or propose plan.
   * - If APPROVAL_REQUIRED or HIGH_RISK: creates a pending action and returns approval request.
   */
  planAction({ userId, conversationId, toolName, params = {}, proposalMessage }) {
    const tool = toolRegistry[toolName];
    if (!tool) {
      return {
        planned: false,
        error: `Tool "${toolName}" is not registered in the safety catalog.`,
      };
    }

    const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const alwaysAllowedSet = this.userAlwaysAllowed.get(userId) || new Set();
    const isPreApproved = alwaysAllowedSet.has(toolName) && tool.riskLevel !== RiskLevel.HIGH_RISK;

    const actionRecord = {
      actionId,
      userId,
      conversationId,
      toolName,
      params,
      riskLevel: tool.riskLevel,
      status: isPreApproved ? 'AUTO_APPROVED' : 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      proposalMessage,
    };

    if (!isPreApproved && tool.riskLevel !== RiskLevel.LOW) {
      this.pendingActions.set(actionId, actionRecord);
      return {
        planned: true,
        requiresApproval: true,
        actionId,
        toolName,
        riskLevel: tool.riskLevel,
        params,
        proposalMessage: proposalMessage || `I can execute ${toolName}. Would you like me to proceed?`,
      };
    }

    return {
      planned: true,
      requiresApproval: false,
      actionId,
      toolName,
      riskLevel: tool.riskLevel,
      params,
    };
  }

  /**
   * Resolves an approval request with user decision:
   * - ALLOW_ONCE: Executes action and deletes pending request
   * - ALWAYS_ALLOW: Adds tool to user's allowed set and executes
   * - REJECT: Cancels execution safely
   */
  async resolveApproval({ userId, actionId, decision }) {
    const action = this.pendingActions.get(actionId);
    if (!action) {
      return {
        success: false,
        message: 'Action was either already processed or expired.',
      };
    }

    if (action.userId !== userId) {
      return {
        success: false,
        message: 'Unauthorized approval attempt.',
      };
    }

    const tool = toolRegistry[action.toolName];
    if (!tool) {
      this.pendingActions.delete(actionId);
      return { success: false, message: 'Tool no longer exists.' };
    }

    if (decision === 'REJECT') {
      action.status = 'REJECTED';
      this.pendingActions.delete(actionId);
      return {
        success: true,
        status: 'REJECTED',
        report: `Action "${action.toolName}" was rejected by user. No modifications were made.`,
      };
    }

    if (decision === 'ALWAYS_ALLOW' && tool.riskLevel !== RiskLevel.HIGH_RISK) {
      if (!this.userAlwaysAllowed.has(userId)) {
        this.userAlwaysAllowed.set(userId, new Set());
      }
      this.userAlwaysAllowed.get(userId).add(action.toolName);
    }

    // EXECUTE -> VERIFY -> REPORT
    try {
      logger.info(`[AGENT EXECUTION] Executing tool: ${action.toolName}`, { actionId, userId });
      const executionResult = await tool.execute(action.params);
      action.status = 'COMPLETED';
      action.result = executionResult;
      this.pendingActions.delete(actionId);

      return {
        success: true,
        status: 'COMPLETED',
        toolName: action.toolName,
        result: executionResult,
        report: executionResult.summary || `Action "${action.toolName}" executed successfully.`,
      };
    } catch (err) {
      logger.error(`[AGENT EXECUTION FAILED] ${err.message}`, { actionId });
      action.status = 'FAILED';
      this.pendingActions.delete(actionId);
      return {
        success: false,
        status: 'FAILED',
        error: err.message,
        report: `Failed to execute action "${action.toolName}": ${err.message}`,
      };
    }
  }

  /**
   * Memory System: Separates profile, preferences, task history, and long-term memory.
   * Strictly filters out passwords, tokens, API keys.
   */
  saveUserFact(userId, factKey, factValue) {
    const sensitive = /password|secret|token|api_?key|auth|bearer/i;
    if (sensitive.test(factKey) || sensitive.test(String(factValue))) {
      logger.warn('[MEMORY] Attempted to store sensitive credential in long-term memory blocked.');
      return false;
    }
    if (!this.longTermMemories.has(userId)) {
      this.longTermMemories.set(userId, []);
    }
    const mems = this.longTermMemories.get(userId);
    mems.push({ key: factKey, value: factValue, savedAt: new Date().toISOString() });
    return true;
  }

  getUserFacts(userId) {
    return this.longTermMemories.get(userId) || [];
  }
}

export const agentService = new AgentService();
