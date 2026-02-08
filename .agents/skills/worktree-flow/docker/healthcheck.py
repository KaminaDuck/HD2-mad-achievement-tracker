"""Minimal health endpoint server for e2e testing.

This server provides simple health and info endpoints for testing
container runtime operations with worktree-flow.
"""

from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"})


@app.route("/")
def root():
    """Root endpoint with service info."""
    return jsonify({"service": "worktree-flow-test", "version": "1.0.0"})


if __name__ == "__main__":
    # Bind to all interfaces on port 8080
    # Port 8080 is used for rootless container compatibility (>= 1024)
    app.run(host="0.0.0.0", port=8080)
