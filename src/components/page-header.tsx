"use client";

import {
  PageHeader as GvazPageHeader,
  useSidebar,
  type PageHeaderProps,
} from "@gvaz/gvaz-ui";
import Link from "next/link";

type Props = Omit<PageHeaderProps, "onMenuToggle" | "LinkComponent">;

export function PageHeader(props: Props) {
  const { toggle } = useSidebar();
  return <GvazPageHeader {...props} onMenuToggle={toggle} LinkComponent={Link} />;
}
