# QRBid — Development Workflow

## Approach

Build QRBid incrementally using a spec-driven workflow. The approved `context/` files define requirements, architecture, design, and current progress. Do not invent missing product behavior.

## Planning and Approval

- Discuss significant features and architectural decisions with the developer before implementation.
- Explain the proposed approach in Slovak, including the reason for important choices.
- Implement only the explicitly approved task scope.
- Never independently change auction rules, authorization, or bid transaction logic.

## Scoping Rules

- Work on one small, verifiable feature or subsystem at a time.
- Keep changes focused; do not modify unrelated files.
- Split tasks that combine unrelated UI, database, authentication, or notification changes.
- If a task cannot be verified quickly, divide it into smaller steps.

## Missing Requirements

- Do not assume undecided behavior is approved.
- Ask for clarification before implementing ambiguous requirements.
- Record unresolved product or architecture questions in `context/progress-tracker.md` if it exists.

## Protected Components

- Do not modify third-party library internals or generated foundation components without explicit instruction.
- Implement QRBid-specific UI and behavior in application-level components.

## Verification and Reporting

After each implementation step:

1. Run the relevant checks or tests available for the change.
2. Verify the implemented behavior against the approved requirements.
3. Report in Slovak what changed, what was tested, and what remains unresolved.
4. Update `context/progress-tracker.md` if it exists, recording actual progress rather than planned progress.

Do not claim tests passed unless they were actually run.

## Documentation

Update relevant context files when an approved decision changes requirements, architecture, UI rules, or code conventions. Avoid duplicating details between documents; refer to the owning context file instead.

## Before Moving On

Continue to the next implementation unit only after the current unit has been reviewed and verified, and the developer approves proceeding.
