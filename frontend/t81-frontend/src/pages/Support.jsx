import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { LifeBuoy } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function Support() {
    useDocumentTitle("Support");
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    if (!isLoggedIn) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">Help Center</h2>
                    <p className="text-[var(--text-secondary)]">Feedback and support.</p>
                </div>
                <Card className="p-12 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <LifeBuoy size={40} />
                    </div>
                    <h3 className="text-2xl font-bold">Login required to contact support</h3>
                    <p className="text-[var(--text-secondary)] max-w-md mx-auto">Please create an account or log in to send feedback or access the help center.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => navigate('/login')}>Log In / Sign Up</Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <LifeBuoy size={48} className="mx-auto text-[var(--primary)] mb-4" />
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">How can we help?</h2>
                <p className="text-[var(--text-secondary)]">We'd love to hear from you. Send us a message.</p>
            </div>

            <Card className="p-8 shadow-xl">
                <form className="space-y-4">
                    <Input label="Subject" placeholder="I have a suggestion..." />
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Message</label>
                        <textarea
                            className="w-full min-h-[150px] p-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-background)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                            placeholder="Describe your issue or idea..."
                        />
                    </div>
                    <Button className="w-full" size="lg">Send Message</Button>
                </form>
            </Card>
        </div>
    );
}
