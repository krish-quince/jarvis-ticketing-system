import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "trix-editor": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        input?: string;
        placeholder?: string;
      };
    }
  }
}

export {};