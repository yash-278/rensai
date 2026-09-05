# Manga Reader Successor

This context defines the product language for the separately named desktop manga-reader successor derived from Houdoku.

## Language

**Successor**:
The independently named open-source product descended from Houdoku. It credits Houdoku but owns its roadmap and makes no permanent promise of drop-in compatibility.
_Avoid_: Fork, reskin, Houdoku v3

**Personal Alpha**:
A personal build for Yash that preserves the inherited application feature set while validating targeted blocker fixes. It is not a publicly distributed release.
_Avoid_: v1, beta, public alpha

**Public Release**:
A later version intended for installation and use beyond Yash, with its own distribution, support, and compatibility promises.
_Avoid_: Personal Alpha, local build

**Local Content**:
User-owned manga supplied from the local filesystem, including supported folders and archives.
_Avoid_: Download, online source

**Online Source**:
A third-party service or website from which manga metadata, chapters, or pages are retrieved.
_Avoid_: Local content, extension

**Extension**:
An installable integration that supplies one or more online sources by executing code outside the core application.
_Avoid_: Built-in source, local import

**Modernization Baseline**:
The verified repairs that remove demonstrated development blockers while preserving the inherited feature set. It is not a mandatory rewrite or feature-removal milestone.
_Avoid_: Roadmap, dependency bump, cleanup

**Product Roadmap**:
New feature and product-direction work enabled as relevant development blockers are repaired, without requiring the superseded local-only modernization program.
_Avoid_: Modernization, revival bootstrap

**Feature Parity**:
Preserving the inherited application's user-visible capabilities and expected behavior while repairing its implementation.
_Avoid_: Local-only scope, feature reduction

**Development Blocker**:
An evidenced failure or constraint that prevents implementing, testing, running, or safely maintaining the application or a planned change.
_Avoid_: Speculative cleanup, mandatory rewrite
