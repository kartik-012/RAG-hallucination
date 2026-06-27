from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.db.database import fetch_all, fetch_one
from app.services.benchmark import run_benchmark, get_benchmark_results, list_benchmark_batches, seed_benchmark

router = APIRouter(prefix="/benchmark", tags=["benchmark"])

_running = False


@router.post("/run")
async def run_benchmark_endpoint(background_tasks: BackgroundTasks):
    global _running
    if _running:
        raise HTTPException(status_code=409, detail="Benchmark already running")
    _running = True

    async def do_run():
        global _running
        try:
            await seed_benchmark()
            batch_id = await run_benchmark()
            return batch_id
        finally:
            _running = False

    # Run synchronously for simplicity (returns when done)
    try:
        await seed_benchmark()
        batch_id = await run_benchmark()
        _running = False
        return {"run_batch_id": batch_id, "status": "complete"}
    except Exception as e:
        _running = False
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/results")
async def list_results():
    batches = await list_benchmark_batches()
    return {"batches": batches}


@router.get("/results/{batch_id}")
async def get_results(batch_id: str):
    results = await get_benchmark_results(batch_id)
    if not results:
        raise HTTPException(status_code=404, detail="Benchmark batch not found")
    return results
