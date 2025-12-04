# Self-Orchestrating Node Demo

This demo showcases distributed orchestration with DSC/MCP for automatic node discovery and coordination.

## Features

- ✅ Automatic node discovery
- ✅ Self-healing behavior
- ✅ State synchronization
- ✅ Health monitoring
- ✅ Auto-scaling based on load
- ✅ Distributed event processing
- ✅ Failover and recovery

## Architecture

```
distributed-node/
  ├── schemas/
  │   └── cluster.schema.ts      # Cluster configuration schema
  ├── orchestration/
  │   ├── dsc.config.ts          # DSC configuration
  │   ├── discovery.ts           # Node discovery logic
  │   ├── health.ts              # Health check implementation
  │   └── coordinator.ts         # Coordination logic
  ├── nodes/
  │   ├── primary.ts             # Primary node implementation
  │   ├── replica.ts             # Replica node implementation
  │   └── worker.ts              # Worker node implementation
  └── monitoring/
      ├── dashboard.ts           # Monitoring dashboard
      └── metrics.ts             # Metrics collection
```

## Cluster Schema

```typescript
export const clusterSchema: PraxisSchema = {
  version: '1.0.0',
  name: 'SelfOrchestrating',
  description: 'Self-orchestrating distributed system',

  orchestration: {
    type: 'dsc',

    nodes: [
      {
        id: 'primary',
        type: 'primary',
        config: {
          role: 'coordinator',
          port: 8080,
        },
      },
      {
        id: 'replica-template',
        type: 'replica',
        config: {
          role: 'read-replica',
          replicateFrom: 'primary',
          port: 8081,
        },
      },
      {
        id: 'worker-template',
        type: 'worker',
        config: {
          role: 'processor',
          port: 8082,
        },
      },
    ],

    sync: {
      interval: 5000,
      conflictResolution: 'last-write-wins',
      targets: ['primary', 'replica-*'],
    },

    health: {
      interval: 30000,
      endpoints: ['/health/live', '/health/ready'],
      timeout: 5000,
    },
  },
};
```

## Key Features

### 1. Automatic Discovery

```typescript
// orchestration/discovery.ts
export class NodeDiscovery {
  private peers: Map<string, NodeInfo> = new Map();

  async discover(): Promise<NodeInfo[]> {
    // Multicast discovery
    const discovered = await multicastDiscover({
      port: 8090,
      timeout: 5000,
    });

    // Register discovered nodes
    for (const node of discovered) {
      if (!this.peers.has(node.id)) {
        await this.registerPeer(node);
      }
    }

    return Array.from(this.peers.values());
  }

  async registerPeer(node: NodeInfo): Promise<void> {
    this.peers.set(node.id, node);
    console.log(`Discovered node: ${node.id} (${node.role})`);

    // Establish connection
    await this.connectToPeer(node);
  }
}
```

### 2. Self-Healing

```typescript
// orchestration/health.ts
export class HealthMonitor {
  async checkHealth(nodeId: string): Promise<HealthStatus> {
    try {
      const response = await fetch(`http://${nodeId}/health/live`);

      if (response.ok) {
        return { status: 'healthy', node: nodeId };
      }

      return { status: 'unhealthy', node: nodeId };
    } catch (error) {
      return { status: 'unreachable', node: nodeId };
    }
  }

  async handleUnhealthy(nodeId: string): Promise<void> {
    console.log(`Node ${nodeId} is unhealthy, initiating recovery...`);

    // Attempt restart
    await this.restartNode(nodeId);

    // Wait and check again
    await sleep(5000);
    const status = await this.checkHealth(nodeId);

    if (status.status !== 'healthy') {
      // Restart failed, trigger failover
      await this.failover(nodeId);
    }
  }

  async failover(failedNodeId: string): Promise<void> {
    console.log(`Failover initiated for ${failedNodeId}`);

    if (failedNodeId === 'primary') {
      // Promote replica to primary
      const replica = this.findHealthyReplica();
      if (replica) {
        await this.promoteToPrimary(replica);
      }
    } else {
      // Remove failed node from rotation
      await this.removeFromCluster(failedNodeId);
    }
  }
}
```

### 3. State Synchronization

```typescript
// orchestration/coordinator.ts
export class StateCoordinator {
  async syncState(state: ClusterState): Promise<void> {
    const nodes = await this.discovery.getActiveNodes();

    // Sync to all nodes in parallel
    await Promise.all(nodes.map((node) => this.syncToNode(node, state)));
  }

  async syncToNode(node: NodeInfo, state: ClusterState): Promise<void> {
    try {
      await fetch(`http://${node.address}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
    } catch (error) {
      console.error(`Sync failed for ${node.id}:`, error);
      // Queue for retry
      this.syncQueue.add({ node, state, retries: 0 });
    }
  }

  async resolveConflict(local: ClusterState, remote: ClusterState): Promise<ClusterState> {
    // Last-write-wins with vector clocks
    const localClock = local.vectorClock;
    const remoteClock = remote.vectorClock;

    if (this.isNewer(remoteClock, localClock)) {
      return remote;
    } else if (this.isNewer(localClock, remoteClock)) {
      return local;
    } else {
      // Concurrent updates, merge
      return this.merge(local, remote);
    }
  }
}
```

### 4. Auto-Scaling

```typescript
// orchestration/scaling.ts
export class AutoScaler {
  async checkScalingNeeds(): Promise<void> {
    const metrics = await this.collectMetrics();

    // Check CPU across all nodes
    const avgCPU = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;

    if (avgCPU > 80 && this.canScaleUp()) {
      await this.scaleUp();
    } else if (avgCPU < 20 && this.canScaleDown()) {
      await this.scaleDown();
    }
  }

  async scaleUp(): Promise<void> {
    console.log('Scaling up cluster...');

    // Spawn new worker node
    const newNode = await this.spawnNode({
      type: 'worker',
      role: 'processor',
    });

    // Wait for it to be healthy
    await this.waitForHealthy(newNode.id);

    // Add to cluster
    await this.addToCluster(newNode);

    console.log(`Scaled up: added node ${newNode.id}`);
  }

  async scaleDown(): Promise<void> {
    console.log('Scaling down cluster...');

    // Find least utilized worker
    const node = await this.findLeastUtilized('worker');

    if (node) {
      // Drain connections
      await this.drain(node.id);

      // Remove from cluster
      await this.removeFromCluster(node.id);

      // Terminate node
      await this.terminateNode(node.id);

      console.log(`Scaled down: removed node ${node.id}`);
    }
  }
}
```

## Running the Demo

### Start Primary Node

```bash
cd examples/distributed-node
npm install

# Start primary coordinator
npm run start:primary
```

### Start Replica Nodes

```bash
# Terminal 2
npm run start:replica -- --id replica-1

# Terminal 3
npm run start:replica -- --id replica-2
```

### Start Worker Nodes

```bash
# Terminal 4
npm run start:worker -- --id worker-1

# Terminal 5
npm run start:worker -- --id worker-2
```

### Monitor Cluster

```bash
# Terminal 6
npm run monitor
```

## Demo Scenarios

### Scenario 1: Automatic Discovery

1. Start primary node
2. Start replica nodes one by one
3. Watch them discover and register
4. Verify state synchronization

### Scenario 2: Self-Healing

1. Start full cluster (1 primary, 2 replicas, 2 workers)
2. Kill a worker node
3. Watch health monitor detect failure
4. Observe automatic restart attempt
5. Watch cluster rebalance

### Scenario 3: Primary Failover

1. Start full cluster
2. Kill primary node
3. Watch health monitor detect failure
4. Observe replica promotion to primary
5. Verify cluster continues operating

### Scenario 4: Auto-Scaling

1. Start cluster with minimal nodes
2. Send high load (simulate with script)
3. Watch metrics exceed threshold
4. Observe automatic scale-up
5. Reduce load
6. Watch automatic scale-down

## Monitoring Dashboard

Access the monitoring dashboard at http://localhost:3000

Features:

- Cluster topology visualization
- Real-time metrics (CPU, memory, requests)
- Health status for all nodes
- State sync visualization
- Event log

## Configuration

### DSC Configuration

Edit `orchestration/dsc.config.ts` to customize:

- Health check intervals
- Scaling thresholds
- Sync strategies
- Recovery actions

### Node Configuration

Each node type can be configured:

- Resource limits
- Port numbers
- Role-specific behavior
- Logging levels

## Testing

```bash
# Run orchestration tests
npm test

# Test specific scenarios
npm test -- --grep "failover"
npm test -- --grep "scaling"
```

## Production Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  primary:
    build: .
    command: npm run start:primary
    ports:
      - '8080:8080'

  replica:
    build: .
    command: npm run start:replica
    deploy:
      replicas: 2
    depends_on:
      - primary

  worker:
    build: .
    command: npm run start:worker
    deploy:
      replicas: 3
    depends_on:
      - primary
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests with:

- StatefulSet for primary
- Deployment for replicas
- DaemonSet for workers
- Service discovery
- Auto-scaling policies

## Performance Metrics

Monitor these metrics:

- Node count and distribution
- State sync latency
- Health check success rate
- Failover time
- Recovery time
- Request throughput

## Next Steps

- Add consensus algorithm (Raft/Paxos)
- Implement leader election
- Add distributed transactions
- Create geographic distribution
- Add service mesh integration
- Implement blue-green deployments

See full implementation in [docs/examples/distributed-node.md](../../docs/examples/distributed-node.md).
