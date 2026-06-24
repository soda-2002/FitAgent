"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { clearCurrentUserId, setCurrentUserId, useCurrentUserId } from "@/lib/currentUser";
import type { UserProfile } from "@/types";

const initialForm: UserProfile = {
  height: undefined,
  weight: undefined,
  age: undefined,
  gender: "",
  goal: "",
  target_weight: undefined,
  training_level: "",
  weekly_training_days: undefined,
  diet_preference: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState<UserProfile>(initialForm);
  const currentUserId = useCurrentUserId();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["height", "weight", "age", "target_weight", "weekly_training_days"].includes(name)
        ? value === "" ? undefined : Number(value)
        : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const profile = await apiFetch<UserProfile>("/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (profile.id) {
        setCurrentUserId(profile.id);
      }
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "提交失败");
    }
  }

  function handleClearCurrentUser() {
    clearCurrentUserId();
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Profile 建档</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          当前 user_id：{currentUserId ?? "未设置"}
        </span>
        {currentUserId && (
          <button
            type="button"
            onClick={handleClearCurrentUser}
            className="text-gray-500 hover:text-red-600 transition-colors"
          >
            清除当前用户
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="身高 (cm)" name="height" type="number" value={form.height ?? ""} onChange={handleChange} />
          <Field label="当前体重 (kg)" name="weight" type="number" value={form.weight ?? ""} onChange={handleChange} />
          <Field label="年龄" name="age" type="number" value={form.age ?? ""} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <select name="gender" value={form.gender ?? ""} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <Field label="减脂目标" name="goal" type="text" value={form.goal ?? ""} onChange={handleChange} placeholder="例：减脂 10kg" />
          <Field label="目标体重 (kg)" name="target_weight" type="number" value={form.target_weight ?? ""} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">训练水平</label>
            <select name="training_level" value={form.training_level ?? ""} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">请选择</option>
              <option value="beginner">初学者</option>
              <option value="intermediate">中级</option>
              <option value="advanced">高级</option>
            </select>
          </div>
          <Field label="每周训练天数" name="weekly_training_days" type="number" value={form.weekly_training_days ?? ""} onChange={handleChange} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">饮食偏好</label>
            <select name="diet_preference" value={form.diet_preference ?? ""} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">请选择</option>
              <option value="no_restriction">无限制</option>
              <option value="vegetarian">素食</option>
              <option value="low_carb">低碳水</option>
              <option value="high_protein">高蛋白</option>
            </select>
          </div>
        </div>

        {saved && currentUserId && <p className="text-green-600 text-sm">✓ 建档成功，当前 user_id = {currentUserId}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors">
          保存建档
        </button>
      </form>
    </div>
  );
}

function Field({
  label, name, type, value, onChange, placeholder,
}: {
  label: string;
  name: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />
    </div>
  );
}
