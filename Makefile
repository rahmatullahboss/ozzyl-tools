.PHONY: materialize install dev test lint check migrate upgrade docker

materialize:
	python bootstrap_source.py --materialize .

install: materialize
	python -m pip install -r requirements-dev.txt

dev: materialize
	flask --app run:app run --debug

test: materialize
	pytest --cov=app
	node --test tests/js/*.test.mjs

lint: materialize
	ruff check .
	ruff format --check .

check: materialize lint test
	python -m compileall -q app migrations tests

migrate: materialize
	flask --app run:app db migrate -m "$(m)"

upgrade: materialize
	flask --app run:app db upgrade

docker:
	docker compose up --build
