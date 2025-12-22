"use client";

import { motion } from "framer-motion";
import ChatClient from "./ChatClient";

function ChatContent() {
  return (
    <div className="flex justify-center items-center bg-gray-100 p-4">
      <div className="container-fluid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col min-h-[200px] border rounded-lg overflow-hidden shadow-lg bg-white"
        >
          <ChatClient />
        </motion.div>
      </div>
    </div>
  );
}

export default ChatContent;
