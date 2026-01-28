import { agentRepository } from './AgentRepository';
import type { AgentConfig } from '../../../shared/types/agent';

/**
 * Seeds initial demo agents into the database
 * This can be called on first startup or manually for testing
 */
export function seedDemoAgents(): void {
  try {
    // Check if agents already exist
    const existingAgents = agentRepository.getAll();
    if (existingAgents.length > 0) {
      return;
    }

    // Create CEO Agent
    const ceoConfig: AgentConfig = {
      name: 'CEO Agent',
      role: 'orchestrator',
      capabilities: ['planning', 'delegation', 'strategy'],
    };
    const ceo = agentRepository.create(ceoConfig);

    // Create CTO Agent
    const ctoConfig: AgentConfig = {
      name: 'CTO Agent',
      role: 'orchestrator',
      parentAgentId: ceo.id,
      capabilities: ['architecture', 'review', 'technical-planning'],
    };
    const cto = agentRepository.create(ctoConfig);

    // Create Developer Agents
    const frontendConfig: AgentConfig = {
      name: 'Frontend Dev',
      role: 'developer',
      parentAgentId: cto.id,
      capabilities: ['react', 'typescript', 'ui-design'],
    };
    agentRepository.create(frontendConfig);

    const backendConfig: AgentConfig = {
      name: 'Backend Dev',
      role: 'developer',
      parentAgentId: cto.id,
      capabilities: ['node', 'database', 'api-design'],
    };
    agentRepository.create(backendConfig);

    const qaConfig: AgentConfig = {
      name: 'QA Engineer',
      role: 'tester',
      parentAgentId: cto.id,
      capabilities: ['testing', 'automation', 'quality-assurance'],
    };
    agentRepository.create(qaConfig);
  } catch (error) {
    console.error('Failed to seed demo agents:', error);
  }
}
