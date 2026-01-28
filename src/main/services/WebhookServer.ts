import express, { Request, Response } from 'express';
import { Server } from 'http';
import { getWorkflowEngine } from './WorkflowEngine';

export class WebhookServer {
  private app: express.Application;
  private server: Server | null = null;
  private port: number;

  constructor(port: number = 3100) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Webhook endpoint for workflow trigger
    this.app.post('/webhook/:workflowId', async (req: Request, res: Response) => {
      const { workflowId } = req.params;
      const triggerData = req.body;

      try {
        const id = parseInt(workflowId, 10);
        if (isNaN(id)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid workflow ID',
          });
        }

        const workflowEngine = getWorkflowEngine();

        // Verify workflow exists
        const workflow = workflowEngine.getWorkflow(id);
        if (!workflow) {
          return res.status(404).json({
            success: false,
            error: `Workflow ${id} not found`,
          });
        }

        // Execute workflow asynchronously
        workflowEngine.execute({ workflowId: id, triggerData })
          .then(result => {
            console.log(`Workflow ${id} executed via webhook:`, result);
          })
          .catch(error => {
            console.error(`Workflow ${id} execution failed:`, error);
          });

        // Return immediate response
        res.json({
          success: true,
          message: 'Workflow execution started',
          workflowId: id,
        });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // List all webhooks (for debugging)
    this.app.get('/webhooks', (req: Request, res: Response) => {
      const workflowEngine = getWorkflowEngine();
      const workflows = workflowEngine.getAllWorkflows();

      const webhooks = workflows.map(w => ({
        id: w.id,
        name: w.name,
        url: `http://localhost:${this.port}/webhook/${w.id}`,
        status: w.status,
      }));

      res.json({ webhooks });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        return resolve();
      }

      this.server = this.app.listen(this.port, () => {
        console.log(`Webhook server listening on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${this.port} is already in use`);
          reject(new Error(`Port ${this.port} is already in use`));
        } else {
          console.error('Webhook server error:', error);
          reject(error);
        }
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        return resolve();
      }

      this.server.close(() => {
        console.log('Webhook server stopped');
        this.server = null;
        resolve();
      });
    });
  }

  isRunning(): boolean {
    return this.server !== null;
  }

  getPort(): number {
    return this.port;
  }
}

// Singleton instance
let instance: WebhookServer | null = null;

export function getWebhookServer(port?: number): WebhookServer {
  if (!instance) {
    instance = new WebhookServer(port);
  }
  return instance;
}
