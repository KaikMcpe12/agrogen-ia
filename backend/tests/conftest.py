"""
Configuração global de testes.
As variáveis de ambiente são definidas ANTES de qualquer import da aplicação,
pois core/config.py instancia Settings() no nível do módulo.
"""
import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test_agrogen")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-purposes-only-32chars!")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("IA_SERVICE_URL", "")   # desativa chamada ao microsserviço ML nos testes
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:3000"]')
