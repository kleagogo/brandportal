#!/bin/bash
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export NODE="/opt/homebrew/bin/node"
cd "/Users/kleagogo/Library/Application Support/Claude/local-agent-mode-sessions/75a44ae7-4bd6-4e2f-843d-90b8588e0d14/6968455d-dd3c-402b-b014-b53f9813338b/local_7cb95a44-b8e0-47f7-b2ec-c12712f471af/outputs/brand-portal"
exec /opt/homebrew/bin/node node_modules/.bin/next dev
