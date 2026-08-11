-- Create initial database schema for REKOMA backend

CREATE TABLE "User" (
    "id" text PRIMARY KEY,
    "email" text NOT NULL UNIQUE,
    "password" text NOT NULL,
    "role" text NOT NULL DEFAULT 'USER',
    "name" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Producteur" (
    "id" text PRIMARY KEY,
    "nom" text NOT NULL,
    "description" text,
    "actif" boolean NOT NULL DEFAULT true,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "RefreshToken" (
    "id" text PRIMARY KEY,
    "token" text NOT NULL UNIQUE,
    "userId" text NOT NULL,
    "revoked" boolean NOT NULL DEFAULT false,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'PRODUCTEUR');
