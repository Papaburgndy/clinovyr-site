"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyTasks } from "@/lib/types";

interface TasksChartProps {
  data: MonthlyTasks[];
}

export function TasksChart({ data }: TasksChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d8d3ca" />
          <XAxis
            dataKey="month"
            tick={{ fill: "#7a7468", fontSize: 12 }}
            axisLine={{ stroke: "#d8d3ca" }}
          />
          <YAxis
            tick={{ fill: "#7a7468", fontSize: 12 }}
            axisLine={{ stroke: "#d8d3ca" }}
          />
          <Tooltip
            contentStyle={{
              background: "#f5f2ed",
              border: "1px solid #d8d3ca",
              borderRadius: "6px",
            }}
          />
          <Line
            type="monotone"
            dataKey="tasks"
            stroke="#1a6b5a"
            strokeWidth={2}
            dot={{ fill: "#1a6b5a", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
