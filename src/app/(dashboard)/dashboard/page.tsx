"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Çıkış yapıldı");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hoş Geldiniz!</CardTitle>
            <CardDescription>
              CollabSpace hesabınıza giriş yaptınız
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">İsim</p>
                  <p className="font-medium">{user?.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Soyisim</p>
                  <p className="font-medium">{user?.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Roller</p>
                <div className="flex gap-2 mt-1">
                  {user?.roles.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-1 bg-primary/10 text-primary text-sm rounded"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Kullanıcı ID</p>
                <p className="font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
