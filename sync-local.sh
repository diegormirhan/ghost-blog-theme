#!/bin/sh
# Copies the theme into the local test Ghost (.ghost-local). A junction would loop, since the theme folder holds .ghost-local.
cd "$(dirname "$0")"
MSYS_NO_PATHCONV=1 robocopy . .ghost-local/content/themes/diego-mirhan /MIR /XD .ghost-local .git node_modules .claude /XF "*.zip" /NFL /NDL /NJH /NJS /NP > /dev/null
exit 0
