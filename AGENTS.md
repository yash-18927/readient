<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Preserve the text lockfile and use frozen installs in CI so dependency resolution is reproducible.
- Use `@typescript/native-preview` explicitly for CI type checking; the unrelated `tsgo` package is not the TypeScript compiler.
- Keep academic deliverables and generated output outside tracked app source to preserve a focused repository.
- Exclude tool caches and generated routes from lint; report formatting as warnings while keeping code-quality errors blocking to avoid an unrelated repository-wide rewrite.
