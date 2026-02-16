import { Link } from "react-router-dom";
import { Store, Facebook, Twitter, Instagram, Mail } from "lucide-react";

const Footer = () => {
    return (
        <footer className="border-t bg-card mt-auto">
            <div className="container py-12">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                                <Store className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold">MSMEHub</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Empowering micro, small, and medium enterprises to reach customers nearby and grow their businesses.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* For Sellers */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">For Sellers</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link to="/register?role=seller" className="hover:text-primary transition-colors">
                                    Start Selling
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Seller Guide
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Success Stories
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Buyers */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">For Buyers</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link to="/products" className="hover:text-primary transition-colors">
                                    Browse Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/categories" className="hover:text-primary transition-colors">
                                    Categories
                                </Link>
                            </li>
                            <li>
                                <Link to="/forums" className="hover:text-primary transition-colors">
                                    Community Forums
                                </Link>
                            </li>
                            <li>
                                <Link to="/nearby" className="hover:text-primary transition-colors">
                                    Find Nearby
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Support</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="#" className="hover:text-primary transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} MSMEHub. All rights reserved. Supporting local businesses everywhere.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
