from docker_runner import run_code


def normalize(output: str) -> str:
    """Strip trailing whitespace from each line and remove blank trailing lines."""
    lines = output.splitlines()
    return "\n".join(line.rstrip() for line in lines).strip()


def evaluate_submission(code: str, language: str, test_cases: list[dict]) -> dict:
    """
    Runs code against all test cases and returns a full verdict.

    Each test_case dict: { "input": str, "expected_output": str }

    Returns:
    {
        "verdict": "Accepted" | "Wrong Answer" | "Runtime Error" | "Time Limit Exceeded",
        "passed": int,
        "total": int,
        "results": [ { "input", "expected", "got", "passed", "error" }, ... ]
    }
    """
    results = []
    passed_count = 0

    for i, tc in enumerate(test_cases):
        stdin_input = tc.get("input", "")
        expected = normalize(tc.get("expected_output", ""))

        run_result = run_code(code, language, stdin_input)

        error = run_result.get("error")
        got = normalize(run_result.get("stdout", ""))
        stderr = run_result.get("stderr", "")

        if error == "tle":
            results.append({
                "test_case": i + 1,
                "input": stdin_input,
                "expected": expected,
                "got": "",
                "passed": False,
                "error": "Time Limit Exceeded",
            })
            # TLE on one case = stop running further
            return {
                "verdict": "Time Limit Exceeded",
                "passed": passed_count,
                "total": len(test_cases),
                "results": results,
            }

        if error or run_result["exit_code"] != 0:
            results.append({
                "test_case": i + 1,
                "input": stdin_input,
                "expected": expected,
                "got": stderr or got,
                "passed": False,
                "error": "Runtime Error",
            })
            return {
                "verdict": "Runtime Error",
                "passed": passed_count,
                "total": len(test_cases),
                "results": results,
            }

        test_passed = got == expected
        if test_passed:
            passed_count += 1

        results.append({
            "test_case": i + 1,
            "input": stdin_input,
            "expected": expected,
            "got": got,
            "passed": test_passed,
            "error": None,
        })

        # Stop on first wrong answer (like real judges)
        if not test_passed:
            return {
                "verdict": "Wrong Answer",
                "passed": passed_count,
                "total": len(test_cases),
                "results": results,
            }

    return {
        "verdict": "Accepted",
        "passed": passed_count,
        "total": len(test_cases),
        "results": results,
    }