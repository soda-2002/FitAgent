"use client";
import { useState } from "react";
import { CheckCircle2, Dumbbell, Flag, Save, Target, Trash2, UserRound } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { clearCurrentUserId, setCurrentUserId, useCurrentUserId } from "@/lib/currentUser";
import type { UserProfile } from "@/types";
import { FormField, PageHeader, Panel, PrimaryButton, StatusAlert, UserBadge, inputClass } from "@/components/ui";

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
      <PageHeader
        eyebrow="Profile setup"
        title="Profile 建档"
        description="把基础身体信息、减脂目标和训练偏好填清楚，后续 Dashboard、饮食分析和 Coach 才能结合你的真实上下文。"
        action={<UserBadge userId={currentUserId} />}
      />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel className="self-start bg-gradient-to-br from-slate-950 to-emerald-950 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
            <UserRound className="h-6 w-6 text-lime-300" />
          </div>
          <h2 className="mt-5 text-2xl font-black">你的减脂档案</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            这里不是复杂账号系统，只是 Demo 当前用户。保存后会把返回的 user_id 写入浏览器 localStorage。
          </p>
          <div className="mt-6 space-y-3">
            <ProfileStep icon={Target} title="目标明确" text={form.goal || "填写减脂目标"} />
            <ProfileStep icon={Flag} title="体重路径" text={`${form.weight ?? "--"} kg → ${form.target_weight ?? "--"} kg`} />
            <ProfileStep icon={Dumbbell} title="训练节奏" text={form.weekly_training_days ? `每周 ${form.weekly_training_days} 天` : "填写训练天数"} />
          </div>
          {currentUserId && (
            <PrimaryButton type="button" variant="danger" icon={Trash2} onClick={handleClearCurrentUser} className="mt-6 w-full">
              清除当前用户
            </PrimaryButton>
          )}
        </Panel>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Panel>
            <SectionTitle title="基础信息" description="用于计算和解释饮食、训练建议的基础上下文。" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="身高 (cm)" name="height" type="number" value={form.height ?? ""} onChange={handleChange} />
              <Field label="当前体重 (kg)" name="weight" type="number" value={form.weight ?? ""} onChange={handleChange} />
              <Field label="年龄" name="age" type="number" value={form.age ?? ""} onChange={handleChange} />
              <FormField label="性别">
                <select name="gender" value={form.gender ?? ""} onChange={handleChange} className={inputClass}>
                  <option value="">请选择</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </FormField>
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="减脂目标" description="让 FitAgent 知道你想达到什么状态。" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="减脂目标" name="goal" type="text" value={form.goal ?? ""} onChange={handleChange} placeholder="例：减脂 10kg" />
              <Field label="目标体重 (kg)" name="target_weight" type="number" value={form.target_weight ?? ""} onChange={handleChange} />
            </div>
          </Panel>

          <Panel>
            <SectionTitle title="训练与饮食" description="保持简单，但足够支持后续计划生成。" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="训练水平">
                <select name="training_level" value={form.training_level ?? ""} onChange={handleChange} className={inputClass}>
                  <option value="">请选择</option>
                  <option value="beginner">初学者</option>
                  <option value="intermediate">中级</option>
                  <option value="advanced">高级</option>
                </select>
              </FormField>
              <Field label="每周训练天数" name="weekly_training_days" type="number" value={form.weekly_training_days ?? ""} onChange={handleChange} />
              <div className="sm:col-span-2">
                <FormField label="饮食偏好">
                  <select name="diet_preference" value={form.diet_preference ?? ""} onChange={handleChange} className={inputClass}>
                    <option value="">请选择</option>
                    <option value="no_restriction">无限制</option>
                    <option value="vegetarian">素食</option>
                    <option value="low_carb">低碳水</option>
                    <option value="high_protein">高蛋白</option>
                  </select>
                </FormField>
              </div>
            </div>
          </Panel>

          {saved && currentUserId && (
            <StatusAlert tone="emerald">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> 建档成功，当前 user_id = {currentUserId}
              </span>
            </StatusAlert>
          )}
          {error && <StatusAlert tone="red">{error}</StatusAlert>}

          <div className="flex justify-end">
            <PrimaryButton type="submit" icon={Save} className="w-full sm:w-auto">
              保存建档
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <FormField label={label}>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className={inputClass} />
    </FormField>
  );
}

function ProfileStep({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3">
      <Icon className="h-5 w-5 text-lime-300" />
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-white/65">{text}</p>
      </div>
    </div>
  );
}
