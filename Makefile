BACKEND_DIR=backend
FRONTEND_DIR=frontend

.PHONY: test-backend test-frontend

test-backend:
	cd $(BACKEND_DIR) && python -m pytest -q

test-frontend:
	cd $(FRONTEND_DIR) && npm test -- --run
