import type { Metadata } from "next";

import { NewCarForm } from "@/components/cars/new-car-form";

export const metadata: Metadata = {
  title: "Garage intake",
};

export default function NewCarPage() {
  return (
    <div className="flex flex-col gap-[2.875rem] p-8">
      <div>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.42em]">
          Fleet
        </p>
        <h1 className="mt-[1.425rem] text-balance text-[2.725rem] font-semibold tracking-tight drop-shadow-xl">
          Add an EV blueprint
        </h1>
        <p className="text-muted-foreground mx-auto mt-8 max-w-2xl text-lg leading-snug tracking-tight text-balance">
          Capacities and AC limits seed the kinetic model — tweak later anytime from settings.
        </p>
      </div>
      <NewCarForm />
    </div>
  );
}
