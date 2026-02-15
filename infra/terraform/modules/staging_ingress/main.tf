locals {
  ingress_name_prefix = trimspace(var.name_prefix) != "" ? trimspace(var.name_prefix) : "headstash-${var.environment}"
  alb_name            = substr("${local.ingress_name_prefix}-alb", 0, 32)
  target_group_name   = substr("${local.ingress_name_prefix}-tg", 0, 32)
  create_https        = trimspace(var.certificate_arn) != ""
  create_route53      = trimspace(var.route53_zone_id) != ""
}

resource "aws_lb" "this" {
  name                       = local.alb_name
  internal                   = var.internal
  load_balancer_type         = "application"
  security_groups            = var.security_group_ids
  subnets                    = var.public_subnet_ids
  idle_timeout               = var.idle_timeout
  drop_invalid_header_fields = true

  enable_deletion_protection = var.enable_deletion_protection
}

resource "aws_lb_target_group" "app" {
  name        = local.target_group_name
  target_type = var.target_type
  port        = var.target_port
  protocol    = var.target_protocol
  vpc_id      = var.vpc_id

  health_check {
    enabled             = true
    path                = var.health_check_path
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 5
    matcher             = var.health_check_matcher
    protocol            = var.target_protocol
  }

  deregistration_delay = 30
}

resource "aws_lb_target_group_attachment" "targets" {
  for_each = toset(var.target_attachment_ids)

  target_group_arn = aws_lb_target_group.app.arn
  target_id        = each.value
  port             = var.target_port
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = local.create_https ? [1] : []

    content {
      type = "redirect"

      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  dynamic "default_action" {
    for_each = local.create_https ? [] : [1]

    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.app.arn
    }
  }
}

resource "aws_lb_listener" "https" {
  count = local.create_https ? 1 : 0

  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

resource "aws_route53_record" "staging_alias_a" {
  count = local.create_route53 ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.record_name
  type    = "A"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "staging_alias_aaaa" {
  count = local.create_route53 && var.create_ipv6_alias ? 1 : 0

  zone_id = var.route53_zone_id
  name    = var.record_name
  type    = "AAAA"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = true
  }
}
