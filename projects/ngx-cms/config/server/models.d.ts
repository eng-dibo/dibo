import mongoose from 'mongoose';
export declare let articles: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    title: StringConstructor;
    subtitle: StringConstructor;
    content: StringConstructor;
    summary: StringConstructor;
    keywords: {
        type: StringConstructor;
        ref: string;
    }[];
    author: {
        type: StringConstructor;
        ref: string;
    };
    status: StringConstructor;
    notes: StringConstructor;
    contacts: StringConstructor;
    categories: StringConstructor[];
    sources: StringConstructor;
};
export declare let jobs: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    title: StringConstructor;
    subtitle: StringConstructor;
    content: StringConstructor;
    summary: StringConstructor;
    keywords: {
        type: StringConstructor;
        ref: string;
    }[];
    author: {
        type: StringConstructor;
        ref: string;
    };
    status: StringConstructor;
    notes: StringConstructor;
    contacts: StringConstructor;
    categories: StringConstructor[];
    sources: StringConstructor;
} & {
    contacts: StringConstructor;
};
export declare let categories: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    title: StringConstructor;
    slug: StringConstructor;
    parent: {
        type: StringConstructor;
        ref: string;
    };
    fb_pages: StringConstructor[];
    config: {};
};
export declare let keywords: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    text: StringConstructor;
    status: StringConstructor;
    count: NumberConstructor;
};
export declare let countries: {
    _id: StringConstructor;
    name: {
        en: StringConstructor;
        native: StringConstructor;
    };
    language: {
        type: StringConstructor;
        ref: string;
    };
    capital: StringConstructor;
    currency: StringConstructor;
};
export declare let cities: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    country: {
        type: StringConstructor;
        ref: string;
    };
    name: {
        en: StringConstructor;
        native: StringConstructor;
    };
};
export declare let languages: {
    _id: StringConstructor;
    name: {
        en: StringConstructor;
        native: StringConstructor;
    };
};
export declare let persons: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    name: StringConstructor[];
    gender: StringConstructor;
    birthday: NumberConstructor[];
    nationality: {
        type: StringConstructor;
        ref: string;
    };
    country: {
        type: StringConstructor;
        ref: string;
    };
    city: {
        type: StringConstructor;
        ref: string;
    };
    ids: {
        type: {
            type: StringConstructor;
        };
        value: StringConstructor;
    }[];
    role: {
        type: typeof mongoose.Types.ObjectId;
        ref: string;
    };
};
export declare let accounts: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    type: StringConstructor;
    entry: StringConstructor;
    user: {
        type: StringConstructor;
        ref: string;
    };
    confirmed: {
        type: BooleanConstructor;
        default: boolean;
    };
    primary: BooleanConstructor;
    active: BooleanConstructor;
    auth: {
        type: {
            String: StringConstructor;
            default: string;
        };
        value: StringConstructor;
    };
    extra: {};
};
export declare let cv: {
    _id: {
        type: StringConstructor;
        default: () => string;
    };
    person: {
        type: StringConstructor;
        ref: string;
    };
    job_hsitory: {
        company: {
            type: StringConstructor;
            ref: string;
        };
        position: StringConstructor;
        notes: StringConstructor;
        period: DateConstructor[];
        country: {
            type: StringConstructor;
            ref: string;
        };
        city: {
            type: StringConstructor;
            ref: string;
        };
    }[];
    education: {
        level: StringConstructor;
        place: {
            type: StringConstructor;
            ref: string;
        };
        department: StringConstructor;
        university: StringConstructor;
        period: DateConstructor[];
    }[];
    languages: {
        language: {
            type: StringConstructor;
            ref: string;
        };
        fluency: NumberConstructor;
    }[];
    skills: {
        name: StringConstructor;
        level: NumberConstructor;
    }[];
};
export declare let places: {
    name: StringConstructor;
    location: StringConstructor[];
    country: {
        type: StringConstructor;
        ref: string;
    };
    city: {
        type: StringConstructor;
        ref: string;
    };
    description: StringConstructor;
    type: StringConstructor;
    head: {
        type: StringConstructor;
        ref: string;
    };
    contacts: {
        type: StringConstructor;
        ref: string;
    }[];
    extra: {};
};
export declare let roles: {
    name: StringConstructor;
    permissions: {
        type: {
            type: StringConstructor;
        };
        scope: StringConstructor;
        allowed: StringConstructor[];
    }[];
};
