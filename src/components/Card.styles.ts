/**
 * Card component styles
 * Separated from component logic for better maintainability
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "border-border",
        elevated: "border-border shadow-md",
        outlined: "border-2 border-border",
        ghost: "border-transparent shadow-none",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export const cardHeaderVariants = cva(
  "flex flex-col space-y-1.5",
  {
    variants: {
      variant: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const cardTitleVariants = cva(
  "text-2xl font-semibold leading-none tracking-tight",
  {
    variants: {
      variant: {
        default: "",
        sm: "text-lg",
        lg: "text-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const cardDescriptionVariants = cva(
  "text-sm text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const cardContentVariants = cva(
  "p-6 pt-0",
  {
    variants: {
      variant: {
        default: "p-6 pt-0",
        sm: "p-4 pt-0",
        lg: "p-8 pt-0",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const cardFooterVariants = cva(
  "flex items-center p-6 pt-0",
  {
    variants: {
      variant: {
        default: "p-6 pt-0",
        sm: "p-4 pt-0",
        lg: "p-8 pt-0",
        none: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardStyleProps extends VariantProps<typeof cardVariants> {
  className?: string;
}

export interface CardHeaderStyleProps extends VariantProps<typeof cardHeaderVariants> {
  className?: string;
}

export interface CardTitleStyleProps extends VariantProps<typeof cardTitleVariants> {
  className?: string;
}

export interface CardDescriptionStyleProps extends VariantProps<typeof cardDescriptionVariants> {
  className?: string;
}

export interface CardContentStyleProps extends VariantProps<typeof cardContentVariants> {
  className?: string;
}

export interface CardFooterStyleProps extends VariantProps<typeof cardFooterVariants> {
  className?: string;
}

export const getCardStyles = (props: CardStyleProps): string => {
  return cn(cardVariants(props));
};

export const getCardHeaderStyles = (props: CardHeaderStyleProps): string => {
  return cn(cardHeaderVariants(props));
};

export const getCardTitleStyles = (props: CardTitleStyleProps): string => {
  return cn(cardTitleVariants(props));
};

export const getCardDescriptionStyles = (props: CardDescriptionStyleProps): string => {
  return cn(cardDescriptionVariants(props));
};

export const getCardContentStyles = (props: CardContentStyleProps): string => {
  return cn(cardContentVariants(props));
};

export const getCardFooterStyles = (props: CardFooterStyleProps): string => {
  return cn(cardFooterVariants(props));
};
