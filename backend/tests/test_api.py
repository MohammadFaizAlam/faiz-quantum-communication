"""API-level tests: validation, contract, gating via the HTTP layer."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    return TestClient(app)


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


def test_simulate_minimal_body(client):
    r = client.post("/api/simulate", json={})
    assert r.status_code == 200
    body = r.json()
    assert body["config"]["n_photons"] == 256
    for key in ("run_id", "config", "photons", "estimation", "decision",
                "retained_key", "encryption", "logs", "warnings",
                "sifted_count", "randomness"):
        assert key in body


def test_simulate_validates_n_photons(client):
    r = client.post("/api/simulate", json={"n_photons": 4})
    assert r.status_code == 422
    r = client.post("/api/simulate", json={"n_photons": 100000})
    assert r.status_code == 422


def test_simulate_validates_rates(client):
    for field in ("interception_rate", "noise_rate", "sample_fraction"):
        r = client.post("/api/simulate", json={field: 1.5})
        assert r.status_code == 422
        r = client.post("/api/simulate", json={field: -0.1})
        assert r.status_code == 422


def test_simulate_validates_threshold(client):
    r = client.post("/api/simulate", json={"threshold": 0.0})
    assert r.status_code == 422
    r = client.post("/api/simulate", json={"threshold": 2.0})
    assert r.status_code == 422


def test_simulate_validates_seed(client):
    r = client.post("/api/simulate", json={"seed": -1})
    assert r.status_code == 422


def test_simulate_rejects_oversized_message(client):
    r = client.post("/api/simulate", json={"message": "x" * 600})
    assert r.status_code == 422


def test_simulate_contract_decision_block(client):
    r = client.post("/api/simulate", json={"n_photons": 500, "seed": 7})
    body = r.json()
    d = body["decision"]
    assert d["status"] in ("PASS", "ABORT", "INCONCLUSIVE")
    assert d["threshold_configured"] == 0.11
    assert d["theoretical_reference"] == 0.11
    assert "not a universal" in d["theoretical_reference_note"]
    # Eve disabled: expected_full_intercept_qber = f/4 = 0.0
    assert d["expected_full_intercept_qber"] == 0.0
    assert "expected_combined_qber" in d
    assert isinstance(body["warnings"], list) and body["warnings"]
    # New information_theory block
    assert "information_theory" in body
    assert "shor_preskill_key_rate" in body["information_theory"]


def test_simulate_abort_hides_ciphertext(client):
    r = client.post("/api/simulate", json={
        "n_photons": 500, "eve_enabled": True, "interception_rate": 1.0,
        "message": "top secret", "seed": 5})
    assert r.status_code == 200
    enc = r.json()["encryption"]
    assert enc["permitted"] is False
    assert "cipher_hex" not in enc


def test_simulate_pass_includes_ciphertext(client):
    r = client.post("/api/simulate", json={
        "n_photons": 1000, "message": "hello", "seed": 12})
    body = r.json()
    assert body["decision"]["status"] == "PASS"
    enc = body["encryption"]
    assert enc["permitted"] is True
    assert enc["decrypted_message"] == "hello"
