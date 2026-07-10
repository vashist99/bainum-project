import AppLayout from "../components/AppLayout";
import BugReportForm from "../components/BugReportForm";
import { Settings } from "lucide-react";

const SettingsPage = () => {
    const breadcrumbs = [{ label: "Settings", href: "/settings" }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-4 sm:p-6 max-w-3xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-3 rounded-xl">
                            <Settings className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Settings</h1>
                            <p className="text-base-content/70 mt-1">
                                Account tools and support options.
                            </p>
                        </div>
                    </div>
                </div>

                <BugReportForm />
            </div>
        </AppLayout>
    );
};

export default SettingsPage;
