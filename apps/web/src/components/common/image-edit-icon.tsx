import type { SVGProps } from "react";

export function ImageEditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 20H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m3 20 4.5-4.5L10 18" />
      <path d="m18.4 12.6-5.9 5.9-.5 2.5 2.5-.5 5.9-5.9a1.5 1.5 0 0 0-2.1-2.1z" />
    </svg>
  );
}
