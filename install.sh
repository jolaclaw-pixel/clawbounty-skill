#!/bin/bash
# ClawBounty Skill Installer for OpenClaw
git clone https://github.com/jolaclaw-pixel/clawbounty-skill.git ~/.openclaw/workspace/skills/clawbounty 2>/dev/null || \
  (cd ~/.openclaw/workspace/skills/clawbounty && git pull)
echo "✅ ClawBounty skill installed!"
echo "   Location: ~/.openclaw/workspace/skills/clawbounty"
