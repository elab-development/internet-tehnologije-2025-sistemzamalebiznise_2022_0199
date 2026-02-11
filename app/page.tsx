"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  return (
    <div>
      <h1>Server pokrenuti ovde</h1>
      <p>Frontend: <a href="http://localhost:8080">http://localhost:8080</a></p>
    </div>
  );
}