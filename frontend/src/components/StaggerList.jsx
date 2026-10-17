import { motion } from "framer-motion";

const container = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

export default function StaggerList({ children, className, as = "div", ...rest }) {
  const Component = motion[as] || motion.div;
  return (
    <Component className={className} variants={container} initial="initial" animate="animate" {...rest}>
      {children}
    </Component>
  );
}
