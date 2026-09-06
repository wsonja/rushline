"use client";

import { useCallback, useEffect, useState } from "react";

export type Campus = "cornell" | "berkeley";

const CAMPUS_KEY = "rushline.campus";
const MOTION_KEY = "rushline.reduceMotion";
const COPILOT_KEY = "rushline.copilotOpen";

export function campusLabel(campus: Campus): string {
  return campus === "berkeley" ? "Berkeley" : "Cornell";
}

export function campusToSchool(campus: Campus): string {
  return campus === "berkeley" ? "UC Berkeley" : "Cornell";
}

export function schoolToCampus(school: string | null | undefined): Campus {
  if (school && /berkeley|ucb/i.test(school)) return "berkeley";
  return "cornell";
}

export function clubMatchesCampus(school: string, campus: Campus): boolean {
  if (campus === "berkeley") return /berkeley|ucb/i.test(school);
  return /cornell/i.test(school);
}

function readFlag(key: string): boolean | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(key);
  if (v === "1") return true;
  if (v === "0") return false;
  return null;
}

export function useCampus(initial?: Campus) {
  const [campus, setCampusState] = useState<Campus>(initial ?? "cornell");

  useEffect(() => {
    const stored = localStorage.getItem(CAMPUS_KEY);
    if (stored === "berkeley" || stored === "cornell") {
      setCampusState(stored);
    } else if (initial) {
      setCampusState(initial);
    }
  }, [initial]);

  const setCampus = useCallback((next: Campus) => {
    setCampusState(next);
    localStorage.setItem(CAMPUS_KEY, next);
  }, []);

  return { campus, setCampus };
}

export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const stored = readFlag(MOTION_KEY);
    const prefers = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const on = stored ?? prefers;
    setReduceMotion(on);
    document.documentElement.classList.toggle("reduce-motion", on);
  }, []);

  const set = useCallback((on: boolean) => {
    setReduceMotion(on);
    localStorage.setItem(MOTION_KEY, on ? "1" : "0");
    document.documentElement.classList.toggle("reduce-motion", on);
  }, []);

  return { reduceMotion, setReduceMotion: set };
}

export function useCopilotOpen(defaultOpen: boolean) {
  const [open, setOpenState] = useState(defaultOpen);

  useEffect(() => {
    const stored = readFlag(COPILOT_KEY);
    if (stored !== null) setOpenState(stored);
  }, []);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    localStorage.setItem(COPILOT_KEY, next ? "1" : "0");
  }, []);

  return { open, setOpen };
}
