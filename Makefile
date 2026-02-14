.PHONY: help dev build start lint typecheck test sanity db-generate db-migrate db-deploy db-reset db-seed db-reset-seed

help:
	@echo "Available targets:"
	@echo "  dev         - Run Next.js dev server"
	@echo "  build       - Build production bundle"
	@echo "  start       - Start production server"
	@echo "  lint        - Run ESLint"
	@echo "  typecheck   - Run TypeScript type-check"
	@echo "  test        - Run project test command"
	@echo "  sanity      - Run lint + prisma generate + typecheck"
	@echo "  db-generate - Generate Prisma client"
	@echo "  db-migrate  - Run prisma migrate dev"
	@echo "  db-deploy   - Run prisma migrate deploy"
	@echo "  db-reset    - Reset local database"
	@echo "  db-seed     - Seed local database with deterministic demo data"
	@echo "  db-reset-seed - Reset + reseed local database"

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

sanity:
	npm run sanity

db-generate:
	npm run db:generate

db-migrate:
	npm run db:migrate

db-deploy:
	npm run db:deploy

db-reset:
	npm run db:reset

db-seed:
	npm run db:seed

db-reset-seed:
	npm run db:reset-seed
