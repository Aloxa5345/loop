"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

export type SignupState =
  | {
    errors?: {
      name?: string;
      email?: string;
      password?: string;
      general?: string;
    };
  }
  | undefined;

export async function signup(
  _state: SignupState,
  formData: FormData
): Promise<SignupState> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email =
    (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  const errors: NonNullable<SignupState>["errors"] = {};

  if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email.";
  }

  if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        errors: {
          email: "An account with this email already exists.",
        },
      };
    }

    // Hash password BEFORE transaction
    const passwordHash = await bcrypt.hash(password, 10);

    // Create everything inside a transaction
    await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
          },
        });

        const workspace = await tx.workspace.create({
          data: {
            name: `${name}'s Workspace`,
            ownerId: user.id,
          },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            role: "ADMIN",
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );
  } catch (error) {
    console.error(error);

    return {
      errors: {
        general: "Something went wrong. Please try again.",
      },
    };
  }

  redirect("/login?registered=1");
}