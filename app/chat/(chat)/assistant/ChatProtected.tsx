"use client";

import { withSessionGuard } from "@/app/providers/withSessionGuard";
import ChatContent from "./ChatContent";

export default withSessionGuard(ChatContent);
