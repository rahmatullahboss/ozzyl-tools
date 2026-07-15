.PHONY: install dev test lint check migrate upgrade docker

install:
	python -m pip install -r requirements-dev.txt

dev:
	flask --app run:app run --debug

test:
	pytest --cov=app
	node --test tests/js/*.test.mjs

lint:
	ruff check .
	ruff format --check .

check: lint test
	python -m compileall -q app migrations tests

migrate:
	flask --app run:app db migrate -m "$(m)"

upgrade:
	flask --app run:app db upgrade

docker:
	docker compose up --build
