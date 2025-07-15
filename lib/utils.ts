import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { NextResponse } from "next/server"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function callApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const user = "admin"
  const password = "monmotdepassesecurise"
  const encoded = Buffer.from(`${user}:${password}`).toString("base64")

  const headers = new Headers(options.headers)
  headers.set("Authorization", `Basic ${encoded}`)
  headers.set("Content-Type", "application/json")

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Appel échoué - ${url} - ${text}`)
  }

  return await response.json()
}