#!/bin/bash
cd "$(dirname "$0")"
npm run dev &
sleep 3
npm run electron:dev
