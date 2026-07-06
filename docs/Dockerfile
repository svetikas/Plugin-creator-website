FROM ghcr.io/astral-sh/uv:alpine AS builder
WORKDIR /app
COPY docs ./docs
COPY theotown_plugin_documentation ./theotown_plugin_documentation
COPY .python-version mkdocs.yml pyproject.toml README.md uv.lock ./
RUN uv run generate && \
    uv run mkdocs build

FROM nginx:alpine
COPY --from=builder /app/site /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
