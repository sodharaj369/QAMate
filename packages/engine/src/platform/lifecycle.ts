import { QAArtifact } from '../domain.js';

export interface ArtifactVersion {
  readonly versionId: string;
  readonly artifacts: QAArtifact[];
  readonly timestamp: Date;
  readonly description: string;
}

export interface GenerationSession {
  readonly sessionId: string;
  readonly requirementId: string;
  readonly history: ArtifactVersion[];
  currentVersionIndex: number;
}

export class GenerationLifecycleEngine {
  /**
   * Initializes a new session.
   */
  public createSession(sessionId: string, requirementId: string): GenerationSession {
    return {
      sessionId,
      requirementId,
      history: [],
      currentVersionIndex: -1,
    };
  }

  /**
   * Records a new version in the session history, advancing the index.
   */
  public commitVersion(
    session: GenerationSession,
    artifacts: QAArtifact[],
    description: string,
  ): ArtifactVersion {
    const versionId = `v-${session.history.length + 1}`;
    const newVersion: ArtifactVersion = {
      versionId,
      artifacts: JSON.parse(JSON.stringify(artifacts)), // deep copy
      timestamp: new Date(),
      description,
    };

    // Remove any forward history if we rollbacked and committed new changes
    if (session.currentVersionIndex < session.history.length - 1) {
      session.history.splice(session.currentVersionIndex + 1);
    }

    session.history.push(newVersion);
    session.currentVersionIndex = session.history.length - 1;
    return newVersion;
  }

  /**
   * Reverts session back to a prior version ID.
   */
  public rollback(session: GenerationSession, versionId: string): QAArtifact[] {
    const index = session.history.findIndex((v) => v.versionId === versionId);
    if (index === -1) {
      throw new Error(`Version ID ${versionId} not found in session history.`);
    }

    session.currentVersionIndex = index;
    return session.history[index].artifacts;
  }

  /**
   * Returns current active artifacts of the session.
   */
  public getActiveArtifacts(session: GenerationSession): QAArtifact[] {
    if (session.currentVersionIndex === -1 || session.history.length === 0) {
      return [];
    }
    return session.history[session.currentVersionIndex].artifacts;
  }

  /**
   * Simulates refinement of a selected artifact.
   */
  public refineArtifact(
    session: GenerationSession,
    artifactId: string,
    instruction: string,
  ): QAArtifact[] {
    const current = this.getActiveArtifacts(session);
    const updated = current.map((art) => {
      if (art.id === artifactId) {
        return {
          ...art,
          content: `${art.content}\n\n// Refinement applied: ${instruction}\n// Applied at: ${new Date().toISOString()}`,
          createdAt: new Date(),
        };
      }
      return art;
    });

    this.commitVersion(session, updated, `Refined artifact ${artifactId}: ${instruction}`);
    return updated;
  }
}
