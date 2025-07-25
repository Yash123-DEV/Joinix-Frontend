"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {FcGoogle} from "react-icons/fc";
import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {Form, FormControl, FormField, FormItem, FormMessage} from "@/components/ui/form"
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";



const formSchema = z.object({
   email : z.string().email(),
   password : z.string().min(8, "Minimum 8 characters"),

});

const SignInCard = () => {

   const router = useRouter();

   

    const form = useForm<z.infer<typeof formSchema>>({
          resolver: zodResolver(formSchema),
          defaultValues : {
             email : "" ,
             password : "",
    
          },
       });
      
      const onSubmit = async (values: z.infer<typeof formSchema>) => {
         console.log({values}); 

         try {
            const res = await fetch("https://joinix-backend1.onrender.com/api/auth/signin", {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify(values),
            })

            const data = await res.json();

            if(!res.ok) {
               throw new Error(data.message || "Something went wrong");
            }

            localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));

console.log("User ID saved:", data.user.id);

setTimeout(() => {
  router.push("/dashboard");
}, 100);
         

         }catch (error) {
            if (error instanceof Error) {
               alert(error.message || "Something went wrong.");
            } else {
               alert("Something went wrong.");
            }
         }
      }

   return (
      <Card className="w-full h-full md:w-[478px] border-none shadow-none">
         <CardHeader className="flex items-center justify-center text-center p-7">
            <CardTitle className="text-xl">
               Welcome back!
            </CardTitle>
         </CardHeader>

         <div className="px-5 mb-2 ">
            <Separator/>
         </div>

         <CardContent className="p-5">
         <Form {...form} >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
               name="email"
               control={form.control}
               render={({ field }) => (
               <FormItem>
                  <FormControl>
                     <Input {...field} type="email" placeholder="email address" required />
                  </FormControl>
               <FormMessage />
               </FormItem>
               )}
               />
               <FormField
               name="password"
               control={form.control}
               render={({field}) => (
                  <FormItem>
                     <FormControl>
                  <Input
               required
               {...field}
               type="password"
               placeholder="password"
               />
               </FormControl>
               <FormMessage />
               </FormItem>
               )}
               
               />
               <Button type="submit" disabled={false} size="lg" className="w-full" >
                   Login
               </Button>
               </form>
               </Form>
         </CardContent>
         <div className="p-5">
            <Separator/>
         </div>

         <CardContent className="p-5 flex flex-col gap-y-4">
            <Button disabled={false} variant="secondary" size="lg" className="w-full">
               <FcGoogle className="mr-2 size-5" />
               Login with Google
            </Button>
         </CardContent>
         <div className="px-5">
            <Separator className="my-4" />
               <div className="flex items-center justify-center py-4">
                  <p className="text-sm text-muted-foreground">
                     Don&apos;t have an account?
                     <Link href="/sign-up" className="ml-1 text-sm font-medium text-blue-600 hover:underline">
                     Sign Up
                     </Link>
                  </p>
               </div>
            </div>
      </Card>
   );
}

export default SignInCard;