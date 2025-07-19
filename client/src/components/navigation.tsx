import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Users, Settings, TestTube } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/dashboard", label: "داشبورد", icon: Home },
    { path: "/representatives", label: "نمایندگان", icon: Users },
    { path: "/settings", label: "تنظیمات", icon: Settings },
    { path: "/demo", label: "تست", icon: TestTube },
  ];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <nav className="flex gap-2 justify-center flex-wrap">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}