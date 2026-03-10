export const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop";

export const HERO_SLIDES = [
    {
        image:
            "https://cdn.prod.website-files.com/67bc58183fe9a751de6f5611/67f1cedcf33de00b028e41d9_revery-casestudy-nike-speed-revealed-hero.png",
        label: "SS 2025",
        headline: "Zero Limits",
        sub: "New season. New speed.",
    },
    {
        image:
            "https://media.endclothing.com/end-features/f_auto,q_auto:eco,w_1520/prodfeatures/Z-5owndAxsiBwRJa_18-03-25_NIKEAIRZOOMSPIRIDONSP_hf9117-400__Email_1200x78.jpg?auto=format,compress",
        label: "Air Collection",
        headline: "Float Forward",
        sub: "The future of cushioning.",
    },
    {
        image:
            "https://static.nike.com/a/images/w_1920,c_limit/fafd7d08-2216-431b-bc56-f81b1cf7056c/the-best-chunky-sneaker-styles-by-nike.jpg",
        label: "Statement Silhouettes",
        headline: "Bold. Loud. Yours.",
        sub: "Chunky done right.",
    },
    {
        image:
            "https://cdn.dribbble.com/userupload/6110032/file/original-a2f2a8b0b923a9abdc7b38fcfff6a160.png?resize=1600x0",
        label: "Design Study",
        headline: "Form Is Function",
        sub: "Where art meets the street.",
    },
];

export const CATEGORY_CARDS = [
    {
        slug: "running",
        name: "Running",
        image:
            "https://static.nike.com/a/images/w_1920,c_limit/fafd7d08-2216-431b-bc56-f81b1cf7056c/the-best-chunky-sneaker-styles-by-nike.jpg",
        span: "large",
    },
    {
        slug: "lifestyle",
        name: "Lifestyle",
        image:
            "https://media.endclothing.com/end-features/f_auto,q_auto:eco,w_1520/prodfeatures/Z-5owndAxsiBwRJa_18-03-25_NIKEAIRZOOMSPIRIDONSP_hf9117-400__Email_1200x78.jpg?auto=format,compress",
        span: "small",
    },
    {
        slug: "training",
        name: "Training",
        image:
            "https://cdn.dribbble.com/userupload/6110032/file/original-a2f2a8b0b923a9abdc7b38fcfff6a160.png?resize=1600x0",
        span: "small",
    },
] as const;

export const VALUE_PROPS = [
    { stat: "Free", label: "Shipping", desc: "On every order over $50" },
    { stat: "30-Day", label: "Returns", desc: "No questions asked" },
    { stat: "100%", label: "Secure", desc: "End-to-end encrypted checkout" },
] as const;

export const EDITORIAL_BANNER = {
    image:
        "https://cdn.prod.website-files.com/67bc58183fe9a751de6f5611/67f1cedcf33de00b028e41d9_revery-casestudy-nike-speed-revealed-hero.png",
    tag: "Editor's Pick",
    headline: "Built for the Long Run",
    body: "Our most technical shoe yet. Engineered for distance, refined for the streets.",
};
