# Atlas Industrial Systems — Mobile Design Plan

## Product framing

Atlas is designed as a calm, precise field companion for people who need to understand a changing industrial operation and act without returning to a desk. The prototype focuses on the repeatable operational loop: **observe → understand → decide → act → verify**. It uses a single sample workspace to demonstrate connected operational data without implying live integration.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Command | A mobile-first command center with the current shift, operational health, decision velocity, prioritized exceptions, active facilities, and a short AI brief. Tapping an exception opens its relevant object or work context. |
| Work | A priority-filtered task queue showing owner, facility, due time, required resources, procedure and evidence status. A work-detail sheet lets a user start, pause, or complete a task and record verification. |
| Assets | A searchable asset registry with health, current location, custodian, maintenance state, and an asset passport view. A scan entry point brings a user directly into the Scan → Understand → Act flow. |
| Projects | A concise portfolio view with schedule, cost, materials, quality, safety, and risk health. Selecting a project reveals work packages, milestones, and a current recovery recommendation. |
| Commerce | A commercial operations surface connecting customer orders, procurement, dispatch, invoices, and risks. It emphasizes at-risk commitments rather than dense financial tables. |
| Intelligence | A persistent industrial copilot with prebuilt operational questions, an explainable recommendation card, sources, confidence, and an authorization state. |
| Universal action sheet | A large, reachable **ACT** control presenting scan, create task, report issue, inspection, receive material, transfer inventory, capture evidence, and ask Atlas actions. |
| Scan / asset context | A recognition result with object identity, risk, records, SOP shortcut, recommended next action, and verification capture. |

## Portrait layout and interaction model

The app is designed for a 9:16 portrait device with one-handed operation. The six primary destinations are organized as five visible tabs—Command, Work, Assets, Projects and Intelligence—with Commerce available through the Command surface and universal action sheet to reduce tab-bar density. A centered floating **ACT** button sits above the tab bar for rapid field entry. Tappable controls are large, content appears in short cards, and the highest-risk decision always precedes supporting detail.

The visual hierarchy follows iOS conventions: a native-feeling large title and compact header treatment, 16–20 pt side gutters, grouped cards, bottom sheets for transient work, and restrained haptic confirmation for deliberate actions. Typography prioritizes clear numerical values, concise labels, and readable secondary copy. The interaction system avoids hover-dependent states and does not rely on colour alone for critical status.

## Key user flows

| User goal | Flow |
|---|---|
| Recover a production delay | Command exception → Work detail → review evidence and recommended recovery → start assigned work → capture verification → mark complete. |
| Inspect an identified machine | ACT → Scan asset → review machine passport and alert history → choose inspection → complete checklist state → attach verification note. |
| Understand an at-risk project | Projects → select project → view schedule, budget and constraint overview → open recovery recommendation → review authority and expected outcome. |
| Ask the copilot what matters | Intelligence → tap suggested prompt or enter a question → receive recommendation, confidence and linked records → create a related task from the suggested next action. |
| Report a field issue | ACT → Report issue → select contextual asset or location → set severity and description → submit event → return to a traceable Work item. |

## Color choices

Atlas uses a dark industrial operating environment rather than a generic consumer dashboard. **Obsidian #0B1216** grounds the screen and reduces glare in operations settings. **Carbon #121D22** and **Steel #1B292F** create layered surfaces. **Signal cyan #21D4C2** is reserved for primary actions, focus, and healthy operation. **Atlas blue #4E9BFF** indicates linked intelligence and navigation. **Amber #F5B84B** communicates attention and emerging constraints. **Critical vermilion #FF6B57** signals immediate risk. **Mist #E8F0F1** and **Slate #8EA0A7** provide clear foreground and secondary text.

## Prototype boundaries

This deliverable demonstrates the user experience and local interactions using in-app sample workspace state. Live authentication, scanners, camera capture, push delivery, offline synchronization, AI inference, server-side authorization, integrations, and audit storage are intentionally represented as interface-ready workflows rather than claimed as active production services.
