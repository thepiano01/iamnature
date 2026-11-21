import { NextResponse } from "next/server";
import { HttpError } from "./auth";

/** 모든 API 응답 규격: 성공 { ok: true, ...data } / 실패 { ok: false, error } */
export function ok<T extends object>(data: T = {} as T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function handle(fn: () => Promise<Response>) {
  return fn().catch((e: unknown) => {
    if (e instanceof HttpError) return fail(e.message, e.status);
    console.error("[api]", e);
    return fail("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", 500);
  });
}
