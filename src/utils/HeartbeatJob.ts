import { ConsoleLogger } from '@nestjs/common';
import { WebSocket } from '@waha/utils/ws';
import { WebSocketServer } from 'ws';

export class HeartbeatJob {
  private interval: ReturnType<typeof setInterval>;

  constructor(
    private log: ConsoleLogger,
    private intervalTime: number = 10_000,
  ) {}

  start(server: WebSocketServer) {
    server.on('connection', (ws: WebSocket) => {
      ws.isAlive = true;
      ws.on('pong', this.onPong(ws));
    });

    this.interval = setInterval(() => {
      server.clients.forEach((client: WebSocket) => {
        if (client.isAlive === false) {
          this.log.debug(
            `Terminating client connection due to heartbeat timeout, ${client.id}`,
          );
          return client.terminate();
        }

        client.isAlive = false;
        this.log.debug(`Sending heartbeat (ping) to ${client.id}`);
        client.ping();
      });
    }, this.intervalTime);
  }

  stop() {
    clearInterval(this.interval);
  }

  private onPong(ws: WebSocket) {
    return (event: any) => {
      ws.isAlive = true;
      this.log.debug(`Heartbeat (pong) received from ${ws.id}`);
    };
  }
}
