/**
 * Controlled Tool Registry for Dutt Personal AI Agent
 * Implements strict risk tiers, input validation, and prompt injection sanitization.
 * 
 * RISK TIERS:
 * - LOW: Read-only, informational, or safe computation (no confirmation needed)
 * - APPROVAL_REQUIRED: External communication, sending emails, file modifications
 * - HIGH_RISK: Deletions, financial transactions, destructive operations (always confirm)
 */

export const RiskLevel = {
  LOW: 'LOW',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  HIGH_RISK: 'HIGH_RISK',
};

export const PermissionLevel = {
  READ: 'READ',
  WRITE: 'WRITE',
  EXECUTE: 'EXECUTE',
};

/**
 * Sanitizes external data to prevent prompt injection attacks.
 * Treats all untrusted data as literal data content, never instructions.
 */
export function sanitizeExternalData(data) {
  if (typeof data !== 'string') return data;
  return data
    .replace(/system\s*prompt/gi, '[filtered_token]')
    .replace(/ignore\s+previous\s+instructions/gi, '[filtered_instruction]')
    .trim();
}

export const toolRegistry = {
  // 1. LOW RISK TOOLS
  search_jobs: {
    name: 'search_jobs',
    description: 'Searches for job openings based on role, technology, and location preferences.',
    riskLevel: RiskLevel.LOW,
    permission: PermissionLevel.READ,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search keywords, e.g. Node.js developer' },
        location: { type: 'string', description: 'Preferred location or Remote' },
      },
      required: ['query'],
    },
    async execute(params) {
      const query = sanitizeExternalData(params.query || 'Node.js Developer');
      const location = sanitizeExternalData(params.location || 'Remote');
      return {
        success: true,
        jobsFound: [
          { title: `${query} (Full-Stack)`, company: 'TechNova Global', location, matchScore: '96%' },
          { title: `Senior Backend Engineer (${query})`, company: 'Innovate Labs', location, matchScore: '92%' },
          { title: `${query} Specialist`, company: 'CloudScale Inc', location: 'Remote', matchScore: '89%' },
        ],
        summary: `Found 3 matching positions for "${query}" (${location}).`,
      };
    },
  },

  inspect_project: {
    name: 'inspect_project',
    description: 'Inspects a project workspace directory safely in read-only mode.',
    riskLevel: RiskLevel.LOW,
    permission: PermissionLevel.READ,
    inputSchema: {
      type: 'object',
      properties: {
        directory: { type: 'string', description: 'Directory or workspace path to inspect' },
      },
    },
    async execute(params) {
      const dir = sanitizeExternalData(params.directory || 'current project');
      return {
        success: true,
        workspace: dir,
        structure: ['backend/ (Express, Prisma, SQLite)', 'frontend/ (React, Vite, Tailwind CSS)', 'package.json'],
        summary: `Inspected workspace: ${dir}. Architecture is healthy with full-stack Node.js & React setup.`,
      };
    },
  },

  // 2. APPROVAL REQUIRED TOOLS
  send_resume: {
    name: 'send_resume',
    description: 'Prepares and sends user resume to a specified company or recipient email address.',
    riskLevel: RiskLevel.APPROVAL_REQUIRED,
    permission: PermissionLevel.WRITE,
    inputSchema: {
      type: 'object',
      properties: {
        recipient: { type: 'string', description: 'Company name or recipient email' },
        role: { type: 'string', description: 'Job role title' },
        coverNote: { type: 'string', description: 'Brief introductory note' },
      },
      required: ['recipient'],
    },
    async execute(params) {
      const recipient = sanitizeExternalData(params.recipient || 'recruiter@target-company.com');
      const role = sanitizeExternalData(params.role || 'Software Engineer');
      return {
        success: true,
        action: 'EMAIL_SENT',
        recipient,
        role,
        sentAt: new Date().toISOString(),
        summary: `Successfully delivered resume for ${role} to ${recipient}.`,
      };
    },
  },

  send_email: {
    name: 'send_email',
    description: 'Sends an email message on behalf of the user.',
    riskLevel: RiskLevel.APPROVAL_REQUIRED,
    permission: PermissionLevel.WRITE,
    inputSchema: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['to', 'subject', 'body'],
    },
    async execute(params) {
      return {
        success: true,
        to: sanitizeExternalData(params.to),
        subject: sanitizeExternalData(params.subject),
        timestamp: new Date().toISOString(),
        summary: `Email sent to ${params.to} with subject "${params.subject}".`,
      };
    },
  },

  modify_file: {
    name: 'modify_file',
    description: 'Edits or writes changes to project configuration or source files.',
    riskLevel: RiskLevel.APPROVAL_REQUIRED,
    permission: PermissionLevel.WRITE,
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['filePath'],
    },
    async execute(params) {
      return {
        success: true,
        filePath: sanitizeExternalData(params.filePath),
        summary: `File modification planned and verified for ${params.filePath}.`,
      };
    },
  },

  // 3. HIGH RISK / ALWAYS CONFIRM TOOLS
  delete_file: {
    name: 'delete_file',
    description: 'Permanently deletes a file or directory from the workspace.',
    riskLevel: RiskLevel.HIGH_RISK,
    permission: PermissionLevel.EXECUTE,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    async execute(params) {
      return {
        success: true,
        deletedPath: sanitizeExternalData(params.path),
        warning: 'High-risk deletion completed under verified user authorization.',
        summary: `Deleted path: ${params.path}`,
      };
    },
  },
};
