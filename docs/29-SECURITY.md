# Volume 3: Architecture & AI Engines - Chapter 29: Security & Credential Isolation

## Purpose
Locks in credential isolation rules, data containment boundaries, and privacy gates.

## Problem
Storing API keys or DevOps PATs in plaintext configuration files risks exposing confidential credentials to source control.

## Goals
- Isolate user credentials from the project codebase.
- Leverage secure system APIs to store keys.

## Non Goals
- Managing team access permissions or user authentication.
- Encrypting generated test strategy markdown documents.

## Architecture
The extension uses VS Code's native SecretStorage interface to read and write API keys and DevOps PATs.

## UX
Renders credential entry fields as password prompts and displays secure connection status badges.

## Engineering
Encrypts token strings using the operating system's credential manager (Keychain/Credential Manager).

## Examples
Saving an Azure DevOps PAT; QAMate writes it to VS Code Secrets Storage instead of user workspace settings.

## Anti Patterns
- Writing API keys or tokens into JSON workspace files or environment variables.

## Acceptance Criteria
- API keys are never written to disk or logs in plaintext.
- All external sync calls use secure authorization headers.

## Future Evolution
Integrate with enterprise single sign-on (SSO) systems to manage credentials dynamically.
