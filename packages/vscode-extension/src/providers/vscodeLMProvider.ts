import * as vscode from 'vscode';
import { ILLMProvider, LLMRequestOptions } from '@qamate/engine';

export class VSCodeLMProvider implements ILLMProvider {
  public readonly id: string;
  public readonly name: string;
  private model: any;

  constructor(model: any) {
    this.model = model;
    this.id = `vscode-lm-${model.id || 'default'}`;
    this.name = model.name || `VS Code Chat (${model.vendor || 'Copilot'})`;
  }

  public async generate(prompt: string, _options?: LLMRequestOptions): Promise<string> {
    const lm = (vscode as any).LanguageModelChatMessage;
    const role = (vscode as any).LanguageModelChatRole?.User || 'user';
    let userMsg: any;
    
    if (lm.User) {
      userMsg = lm.User(prompt);
    } else {
      userMsg = new lm(role, prompt);
    }

    const cancellationToken = new vscode.CancellationTokenSource().token;
    const response = await this.model.sendRequest([userMsg], {}, cancellationToken);
    
    let text = '';
    for await (const chunk of response.text) {
      text += chunk;
    }
    return text;
  }
}
